class_name ORPC_HTTP_Client_${apiSlug}
extends Node

var api = "${api}"
var server_host: String
var server_port: int
var server_url: String
var option_request_timeout: int = 1
var option_log_level: int = 1 # 0 Debug; 1 Info; 2 Warning; 3 Error

signal on_request_failure(error: HTTPRequest.Result)
signal on_server_error(code: int)
signal on_invalid_response(response: String)
signal on_response(response: Variant)

var _registered_procedures: Array[ProcedureRequest] = []

func _init(host: String, port: int, options: Dictionary[String, Variant] = {}):
    server_host = host
    server_port = port
    server_url = "http://%s:%d" % [server_host, server_port]
    if options.has("request_timeout"):
        option_request_timeout = options["request_timeout"]
    if options.has("log_level"):
        option_log_level = options["log_level"]

func send(options: Dictionary[String, Variant] = {}) -> ORPC_HTTP_Client_${apiSlug}:
    var http_request = HTTPRequest.new()
    add_child(http_request)
    http_request.request_completed.connect(_on_request_done)
    http_request.timeout = option_request_timeout

    var headers = ["Content-Type: application/json"]
    var payload = _build_request_payload(options)
    var json_string = JSON.stringify(payload)

    if option_log_level < 2:
        print("[DEBUG] Sending payload to %s" % server_url)
        print(json_string)

    var error = http_request.request(server_url, headers, HTTPClient.METHOD_POST, json_string)
    if error != OK:
        if option_log_level <= 3:
            print("[ERROR] Request failed with error code %d" % error)
        on_request_failure.emit(error)
        queue_free()
    return self

func add_procedure(name: String, id: String = "", input: Variant = null) -> ORPC_HTTP_Client_${apiSlug}:
    if id == "":
        id = name
    _registered_procedures.append(ProcedureRequest.new(name, id, input))
    if option_log_level < 2:
        print("[DEBUG] Procedure execution added to the stack name: %s; id: %s" % [name, id])
    return self

# replace: proceduresCode

func _on_request_done(result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
    _registered_procedures = []

    if result != HTTPRequest.RESULT_SUCCESS:
        if option_log_level <= 3:
            print("[ERROR] Request failed with error code %d" % result)
        on_request_failure.emit(result)
    elif response_code < 200 or response_code >= 300:
        if option_log_level <= 3:
            print("[ERROR] Server response code %d" % response_code)
        on_server_error.emit(response_code)
    else:
        var response_string = body.get_string_from_utf8()
        var json = JSON.new()
        var parse_err = json.parse(response_string)

        if parse_err == OK:
            var payload = json.get_data()
            on_response.emit(payload)
            if option_log_level < 2:
                print("[DEBUG] Response payload")
                print(payload)
        else:
            if option_log_level <= 3:
                print("[ERROR] Invalid server response content")
                print(response_string)
            on_invalid_response.emit(response_string)

    queue_free()

func _build_request_payload(options: Dictionary[String, Variant] = {}) -> Variant :
    var procedures_json: Array[Variant] = []
    for procedure in _registered_procedures:
        procedures_json.append(procedure.to_simple_obj())

    var options_payload = {}

    if options.has("authentication"):
        options_payload["authentication"] = options.authentication
    if options.has("execution"):
        options_payload["execution"] = options.execution

    var payload = {
        "protocol": "v1",
        "api": api,
        "procedures": procedures_json
    }

    if not options_payload.is_empty():
        payload["options"] = options_payload

    return payload

class ProcedureRequest:
    var id: String
    var name: String
    var input: Variant

    func _init(p_id: String, p_name: String, p_input: Variant) -> void:
        id = p_id
        name = p_name
        input = p_input

    func to_simple_obj() -> Variant:
        var json = {
            "id": id,
            "name": name,
        }

        if input:
            json["input"] = input

        return json
