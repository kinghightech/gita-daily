import { DeviceEventEmitter } from 'react-native';

export const APP_TOAST_EVENT = 'gitaDaily.appToast.v1';

export type AppToastPayload = {
  title: string;
  message?: string;
};

export const showAppToast = (payload: AppToastPayload) => {
  DeviceEventEmitter.emit(APP_TOAST_EVENT, payload);
};
