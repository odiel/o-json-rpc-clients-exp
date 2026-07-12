class_name ORPC_HTTP_Client_${apiSlug}
extends Node

var api = "${api}"
var server_host: String
var server_port: int
var server_url: String
var option_request_timeout: int = 1
var option_log_level: int = 1 # 0 Debug; 1 Info; 2 Warning; 3 Error

var _registered_procedures: Array[ProcedureRequest] = []

func _init(host: String, port: int, options: Dictionary[String, Variant] = {}):
    server_host = host
    server_port = port
    server_url = "http://%s:%d" % [server_host, server_port]
    if options.has("request_timeout"):
        option_request_timeout = options["request_timeout"]
    if options.has("log_level"):
        option_log_level = options["log_level"]

func send(options: RequestOptions = null) -> ORPC_HTTP_Client_${apiSlug}.Response:
    var http_request = HTTPRequest.new()
    add_child(http_request)
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

        return Response.create_error("request_failure", error)

    var network_result = await http_request.request_completed
    var result: int = network_result[0]
    var response_code: int = network_result[1]
    var body: PackedByteArray = network_result[3]

    http_request.queue_free()
    _registered_procedures.clear()

    if result != HTTPRequest.RESULT_SUCCESS:
        return Response.create_error("request_failure", "%s" % result)

    if response_code < 200 or response_code >= 300:
        return Response.create_error("server_failure", "%s" % response_code)

    var response_string = body.get_string_from_utf8()
    var json = JSON.new()
    var response_payload = json.parse(response_string)

    if response_payload != OK:
        if option_log_level <= 3:
            print("[ERROR] Invalid server response content")
            print(response_string)
        return Response.create_error("invalid_response", response_string)

    if option_log_level < 2:
        print("[DEBUG] Response payload")
        print(response_string)

    return Response.create_success(json.get_data())

func add_procedure(name: String, id: String = "", input: Variant = null) -> ORPC_HTTP_Client_${apiSlug}:
    if id == "":
        id = name
    _registered_procedures.append(ProcedureRequest.new(name, id, input))
    if option_log_level < 2:
        print("[DEBUG] Procedure execution added to the stack name: %s; id: %s" % [name, id])
    return self

# replace: proceduresCode

func _build_request_payload(options: RequestOptions = null) -> Variant :
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

class ProcedureRequest:
    var id: String
    var name: String
    var input: Variant

    func _init(p_id: String, p_name: String, p_input: Variant) -> void:
        id = p_id
        name = p_name
        input = p_input

    func to_simple_obj() -> Variant:
        var json = {"id": id, "name": name }

        if input:
            json["input"] = input

        return json

class Response:
    var is_ok: bool = false
    var error_type: String = ""
    var error_code: String = ""
    var data: Variant = null

    static func create_success(p_data: Variant) -> Response:
        var res = Response.new()
        res.is_ok = true
        res.data = p_data
        return res

    static func create_error(type: String, code: String) -> Response:
        var res = Response.new()
        res.is_ok = false
        res.error_type = type
        res.error_code = code
        return res

class RequestOptions:
    var authentication: RequestAuthentication

    static func with_authentication(authentication: RequestAuthentication) -> RequestOptions:
        var res = RequestOptions.new()
        res.authentication = authentication
        return res

    func to_payload() -> Variant:
        var payload = {}

        if (authentication):
            payload["authentication"] = authentication.to_payload()

        return payload

class RequestExecution:
    var strategy: String = "parallel"
    var procedure_timeout: int = 5

    static func with_sequential_strategy(procedure_timeout: int = 5) -> RequestExecution:
        var res = RequestExecution.new()
        res.strategy = "sequential"
        res.procedure_timeout = procedure_timeout
        return res

    static func with_parallel_strategy(procedure_timeout: int = 5) -> RequestExecution:
        var res = RequestExecution.new()
        res.strategy = "parallel"
        res.procedure_timeout = procedure_timeout
        return res

class RequestAuthentication:
    var scheme: String = ""
    var token: String = ""
    var token_type: String = ""
    var provider: String = ""

    static func with_session(token: String, token_type: String) -> RequestAuthentication:
        var res = RequestAuthentication.new()
        res.scheme = "session"
        res.token = token
        res.token_type = token_type
        return res

    static func with_access_token(token: String) -> RequestAuthentication:
        var res = RequestAuthentication.new()
        res.scheme = "access_token"
        res.token = token
        res.token_type = "jwt"
        return res

    static func with_refresh_token(token: String) -> RequestAuthentication:
        var res = RequestAuthentication.new()
        res.scheme = "refresh_token"
        res.token = token
        res.token_type = "jwt"
        return res

    static func with_identity_provider(token: String, token_type: String, provider: String) -> RequestAuthentication:
        var res = RequestAuthentication.new()
        res.scheme = "identity_provider"
        res.token = token
        res.token_type = token_type
        return res

    func to_payload() -> Variant:
        var payload = {
            "scheme": scheme,
            "token": token,
            "token_type": token_type
        }

        if provider:
            payload["provider"] = provider

        return payload
