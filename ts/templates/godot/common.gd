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
	var execution: RequestExecution

	func use_authentication(p_authentication: RequestAuthentication) -> RequestOptions:
		self.authentication = p_authentication
		return self

	func use_sequential_strategy(p_execution: RequestExecution) -> RequestOptions:
		self.execution = p_execution
		return self


	func to_payload() -> Variant:
		var payload = {}

		if (authentication):
			payload["authentication"] = authentication.to_payload()

		if execution:
			payload["execution"] = execution.to_payload()

		return payload

class RequestExecution:
	var strategy: String = "parallel"
	var procedure_timeout: int = 5

	static func with_sequential_strategy(p_procedure_timeout: int = 5) -> RequestExecution:
		var res = RequestExecution.new()
		res.strategy = "sequential"
		res.procedure_timeout = p_procedure_timeout
		return res

	static func with_parallel_strategy(p_procedure_timeout: int = 5) -> RequestExecution:
		var res = RequestExecution.new()
		res.strategy = "parallel"
		res.procedure_timeout = p_procedure_timeout
		return res

	func to_payload() -> Variant:
		var payload = {
			"strategy": strategy,
		}

		return payload

class RequestAuthentication:
	var scheme: String = ""
	var token: String = ""
	var token_type: String = ""
	var provider: String = ""

	static func with_session(p_token: String, p_token_type: String) -> RequestAuthentication:
		var res = RequestAuthentication.new()
		res.scheme = "session"
		res.token = token
		res.token_type = token_type
		return res

	static func with_access_token(p_token: String) -> RequestAuthentication:
		var res = RequestAuthentication.new()
		res.scheme = "access_token"
		res.token = p_token
		res.token_type = "jwt"
		return res

	static func with_refresh_token(p_token: String) -> RequestAuthentication:
		var res = RequestAuthentication.new()
		res.scheme = "refresh_token"
		res.token = p_token
		res.token_type = "jwt"
		return res

	static func with_identity_provider(p_token: String, p_token_type: String, _provider: String) -> RequestAuthentication:
		var res = RequestAuthentication.new()
		res.scheme = "identity_provider"
		res.token = p_token
		res.token_type = p_token_type
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
