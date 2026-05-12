export {};

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        opts?: {
          onSuccess?: (result: Record<string, string>) => void;
          onPending?: (result: Record<string, string>) => void;
          onError?: (result: Record<string, string>) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}
