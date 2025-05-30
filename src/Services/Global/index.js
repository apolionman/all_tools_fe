import { useMutation } from "@tanstack/react-query";
import { speechToText, chatMessage } from "./api";
export const useSpeechToTextMutation = () => useMutation({
    mutationKey: ["speech-to-text"],
    mutationFn: speechToText,
});
export const useChatMessageMutation = () => useMutation({
    mutationKey: ["chat-message"],
    mutationFn: chatMessage,
});
