class_name ORPC_Common
extends RefCounted

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
