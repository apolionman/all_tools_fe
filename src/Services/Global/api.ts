import axios, { AxiosRequestConfig } from "axios";
const url = "https://dev-api.genetiq.ai";
export const speechToText = async (audioBlob: Blob) => {
	const formData = new FormData();
	formData.append("file", audioBlob);
	const config: AxiosRequestConfig = {
		method: "POST",
		url: `${url}/api/transcribe`,
		data: formData,
	};

	return axios(config).then(({ data }) => data);
};
export const chatMessage = (prompt: string) => {
	let form = new FormData();
	form.append("prompt", prompt);
	const config: AxiosRequestConfig = {
		method: "POST",
		url: `${url}/api/v1/chat`,
		data: form,
	};

	return axios(config).then(({ data }) => data);
};