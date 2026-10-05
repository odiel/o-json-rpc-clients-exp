class_name ORPC_WS_Client_${apiSlug}
extends Node

signal connection_established
signal connection_closed(code: int, reason: String)
signal max_reconnect_attempts_reached()
signal message_received(data: Variant)

var api = "${api}"
var server_host: String
var server_port: int
var server_url: String
var option_request_timeout: int = 1
var option_log_level: int = 1 # 0 Debug; 1 Info; 2 Warning; 3 Error

var _registered_procedures: Array[ORPC_Common.ProcedureRequest] = []

var _socket: WebSocketPeer
var _state: int = WebSocketPeer.STATE_CLOSED
var _disconnected: bool = false
var _auto_reconnect: bool = false
var _max_reconnect_attempts: int = 10
var _reconnect_count = 0
var _reconnect_delay: float = 1.0

func _init(host: String, port: int, options: Dictionary[String, Variant] = {}):
	server_host = host
	server_port = port
	server_url = "ws://%s:%d" % [server_host, server_port]

	if options.has("log_level"):
		option_log_level = options["log_level"]

	var tree := Engine.get_main_loop()
	if tree:
		tree.root.add_child(self)

func _exit_tree() -> void:
	close()

func open(auto_reconnect: bool = false, reconect_attempts: int = 10) -> void:
	if _state == WebSocketPeer.STATE_CLOSED:
		_disconnected = false
		_reconnect_count = 0
		_auto_reconnect = auto_reconnect
		_max_reconnect_attempts = reconect_attempts

		_socket = WebSocketPeer.new()
		# 256KB
		_socket.inbound_buffer_size = 262,144
		connect_to_host()

func close() -> void:
	_disconnected = true
	_reconnect_count = 0

	_log_message("WS disconnecting", 1)

	if _socket && _state == WebSocketPeer.STATE_OPEN:
		_socket.close(1000, "Normal Closure")
		_socket = null

func connect_to_host() -> void:
	var err = _socket.connect_to_url(server_url)
	if err != OK:
		_log_message("WS connection failed %d" % err, 3)
		return

	_log_message("WS connecting to %s" % server_url, 1)

func _process(_delta) -> void:
	if _socket:
		_socket.poll()

		var state = _socket.get_ready_state()

		if state == WebSocketPeer.STATE_OPEN:
			if _state != WebSocketPeer.STATE_OPEN:
				_log_message("WS connected!", 1)

				_reconnect_count = 0
				_disconnected = false
				connection_established.emit()

			_state = state

			while _socket.get_available_packet_count() > 0:
				var packet_bytes = _socket.get_packet()

				if _socket.was_string_packet():
					_handle_string_data(packet_bytes.get_string_from_utf8())

			return

		if state == WebSocketPeer.STATE_CLOSED:
			if _state == WebSocketPeer.STATE_OPEN or _state == WebSocketPeer.STATE_CONNECTING:
				_on_disconnect(_socket.get_close_code(), _socket.get_close_reason())

		_state = state

func _on_disconnect(code, reason):
	_log_message("WS disconnected; code: %d, reason: %s" % [code, reason], 2)

	connection_closed.emit(code, reason)
	if _auto_reconnect and not _disconnected:
		if _reconnect_count >= _max_reconnect_attempts:
			_log_message("WS max reconnection attempts reached.", 2)
			max_reconnect_attempts_reached.emit()
			return

		_reconnect()

func _reconnect():
	_reconnect_count += 1
	var delay = _reconnect_delay * _reconnect_count
	_log_message("WS reconnecting in %.1f seconds; attempt: %d/%d" % [delay, _reconnect_count, _max_reconnect_attempts], 1)

	var tree := Engine.get_main_loop()
	await tree.create_timer(delay).timeout

	connect_to_host()

func _handle_string_data(text_msg: String) -> void:
	var json = JSON.new()
	if json.parse(text_msg) == OK:
		_log_message("WS receiving message <=", 0)
		_log_message(text_msg, 0)

		# todo: check errors here
		message_received.emit(json.data)

func is_connection_open() -> bool:
	return _state == WebSocketPeer.STATE_OPEN

func add_procedure(p_name: String, id: String = "", input: Variant = null) -> ORPC_WS_Client_${apiSlug}:
	if id == "":
		id = p_name
	_registered_procedures.append(ORPC_Common.ProcedureRequest.new(id, p_name, input))

	_log_message("WS procedure added to the stack; name: %s; id: %s" % [p_name, id], 0)

	return self

func send(options: ORPC_Common.RequestOptions = null):
	var payload = _build_request_payload(options)
	var json_string = JSON.stringify(payload)

	_log_message("WS sending message =>", 0)
	_log_message(json_string, 0)

	if _socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		_socket.send_text(json_string)

	_registered_procedures.clear()

# replace: proceduresCode

func _build_request_payload(options: ORPC_Common.RequestOptions = null) -> Variant :
	var procedures_json: Array[Variant] = []
	for procedure in _registered_procedures:
		procedures_json.append(procedure.to_simple_obj())

	var options_payload = {}

	if options:
		options_payload = options.to_payload()

	var payload = {
		"protocol": "v1",
		"api": api,
		"procedures": procedures_json
	}

	if not options_payload.is_empty():
		payload["options"] = options_payload

	return payload

func _log_message(message: String, level: int) -> void:
	var prefix = ""
	match str(level):
		"0":
			prefix = "[DEBUG] "
		"1":
			prefix = "[INFO] "
		"2":
			prefix = "[WARN] "
		"3":
			prefix = "[ERROR] "

	if option_log_level <= level:
		print(prefix + message)