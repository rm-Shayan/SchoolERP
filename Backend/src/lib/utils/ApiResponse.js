class ApiResponse {
  constructor(message, statusCode, data = null) {
    this.message = message;
    this.statusCode = statusCode;
    this.data = data;
    this.success = statusCode < 400;
  }
  static ok = (message = "Success", data = null) => {
    return new ApiResponse(message, 200, data);
  };
  static created = (message = "Created", data = null) => {
    return new ApiResponse(message, 201, data);
  };
  static noContent = (message = "No Content") => {
    return new ApiResponse(message, 204);
  };
  static clientError = (message = "Client Error", statusCode = 400) => {
    return new ApiResponse(message, statusCode);
  };

}

export default ApiResponse;
