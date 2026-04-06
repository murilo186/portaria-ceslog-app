export type AuthEventReason = "expired" | "unauthorized" | "required";

export type AuthEventPayload = {
  reason: AuthEventReason;
  message: string;
};

const AUTH_EVENT_NAME = "portaria:auth-required";

export function emitAuthRequired(payload: AuthEventPayload) {
  window.dispatchEvent(new CustomEvent<AuthEventPayload>(AUTH_EVENT_NAME, { detail: payload }));
}

export function subscribeAuthRequired(handler: (payload: AuthEventPayload) => void): () => void {
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<AuthEventPayload>;
    handler(customEvent.detail);
  };

  window.addEventListener(AUTH_EVENT_NAME, listener);

  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, listener);
  };
}

