const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('./env');

const preferredModel = 'gemini-3.8-flash';
const requestedModel = process.env.GEMINI_MODEL;
const modelName = requestedModel && /^gemini-3\./i.test(requestedModel)
  ? requestedModel
  : preferredModel;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: modelName });

module.exports = { model, modelName };
