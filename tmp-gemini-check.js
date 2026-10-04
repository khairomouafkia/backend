const { getChatResponse } = require('./services/ai.service');

(async () => {
  try {
    const result = await getChatResponse('مرحبا');
    console.log('RESULT_OK', typeof result, String(result).slice(0, 80));
  } catch (error) {
    console.log('STATUS', error && error.statusCode);
    console.log('MESSAGE', error && error.message);
    console.log('ERRORS', JSON.stringify(error && error.errors, null, 2));
  }
})();
