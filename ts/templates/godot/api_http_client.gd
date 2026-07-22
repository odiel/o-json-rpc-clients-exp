class_name ORPC_HTTP_Client_${apiSlug}
extends Node

var api = "${api}"
var server_host: String
var server_port: int
var server_url: String
var option_request_timeout: int = 1
var option_log_level: int = 1 # 0 Debug; 1 Info; 2 Warning; 3 Error

var _registered_procedures: Array[ORPC_Common.ProcedureRequest] = []

func _init(host: String, port: int, options: Dictionary[String, Variant] = {}):
	server_host = host
	server_port = port
	server_url = "http://%s:%d" % [server_host, server_port]
	if options.has("request_timeout"):
		option_request_timeout = options["request_timeout"]
	if options.has("log_level"):
		option_log_level = options["log_level"]

func send_sequential(options: ORPC_Common.RequestOptions = null) -> ORPC_Common.Response:
	options.execution.strategy = "sequential"
	return await self.send(options)

func send(options: ORPC_Common.RequestOptions = null) -> ORPC_Common.Response:
	var http_request = HTTPRequest.new()
	add_child(http_request)
	http_request.timeout = option_request_timeout

	var headers = ["Content-Type: application/json"]
	var payload = _build_request_payload(options)
	var json_string = JSON.stringify(payload)

	if option_log_level < 2:
		print("[DEBUG] => Request payload to %s" % server_url)
		print(json_string)

	var error = http_request.request(server_url, headers, HTTPClient.METHOD_POST, json_string)
	if error != OK:
		if option_log_level <= 3:
			print("[ERROR] Request failed with error code %d" % error)

		return ORPC_Common.Response.create_error("request_failure", "%d" % error)

	var network_result = await http_request.request_completed
	var result: int = network_result[0]
	var response_code: int = network_result[1]
	var body: PackedByteArray = network_result[3]

	http_request.queue_free()
	_registered_procedures.clear()

	if result != HTTPRequest.RESULT_SUCCESS:
		if option_log_level <= 3:
			print("[ERROR] Server response error %d" % error)
		return ORPC_Common.Response.create_error("request_failure", "%s" % result)

	if response_code < 200 or response_code >= 300:
		if option_log_level <= 3:
			print("[ERROR] Server response not OK %d" % error)

		return ORPC_Common.Response.create_error("server_failure", "%s" % response_code)

	var response_string = body.get_string_from_utf8()
	var json = JSON.new()
	var response_payload = json.parse(response_string)

	if response_payload != OK:
		if option_log_level <= 3:
			print("[ERROR] Invalid server response content")
			print(response_string)
		return ORPC_Common.Response.create_error("invalid_response", "%s" % response_string)

	if option_log_level < 2:
		print("[DEBUG] <= Response payload")
		print(response_string)

	return ORPC_Common.Response.create_success(json.get_data())

func add_procedure(p_name: String, id: String = "", input: Variant = null) -> ORPC_HTTP_Client_${apiSlug}:
	if id == "":
		id = p_name
	_registered_procedures.append(ORPC_Common.ProcedureRequest.new(name, id, input))
	if option_log_level < 2:
		print("[DEBUG] Procedure added to the stack; name: %s; id: %s" % [name, id])
	return self

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
