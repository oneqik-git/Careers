export function extractError(error) {
  const response = error?.response?.data;

  if (response?.error) {
    return {
      code: response.error.code,
      message: response.error.message || response.message || 'Request failed',
      details: response.error.details || [],
      status: error.response?.status || 500,
    };
  }

  return {
    code: 'REQUEST_FAILED',
    message: response?.message || error?.message || 'Something went wrong',
    details: [],
    status: error?.response?.status || 500,
  };
}
