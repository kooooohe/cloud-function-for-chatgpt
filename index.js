const functions = require('@google-cloud/functions-framework');
const { Configuration, OpenAIApi } = require("openai");
const {verifyRequestSignature} = require('@slack/events-api');

const configuration = new Configuration({
	apiKey: process.env.CHAT_GPT_API_TOKEN,
});

const openai = new OpenAIApi(configuration);


const postMessage = async (payload) => {

	let result

	try {
		result = await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			//model: "gpt-4",
			messages: [{ role: "user", content: `your own text ${payload.event.text}
` }],
		});
	} catch (error) {
		console.log(error)
	}



	const bodyj = {
		channel:payload.event.channel,
		text: result.data.choices[0].message.content
	}
	const res = await fetch('https://slack.com/api/chat.postMessage', {
		method: 'post',
		headers: { 'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(bodyj),
	});


	if (!res.ok) {
		console.error(res);
	}
	return res;
}


functions.http('Main', (req, res) => {
	const payload = req.body;
	verifyWebhook(req);


	if (payload.type === 'url_verification') {
		return res.status(200).json({ 'challenge': payload.challenge });
	}


	if (payload.event && payload.event.type === 'app_mention') {
		postMessage(payload)
	}

	res.status(200).send('OK');
});

const verifyWebhook = req => {
	const signature = {
		signingSecret: process.env.SIGNING_SECRET,
		requestSignature: req.headers['x-slack-signature'],
		requestTimestamp: req.headers['x-slack-request-timestamp'],
		body: req.rawBody,
	};

	// This method throws an exception if an incoming request is invalid.
	verifyRequestSignature(signature);
};

