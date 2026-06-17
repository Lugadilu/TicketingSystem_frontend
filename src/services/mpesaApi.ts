// src/services/mpesaApi.ts
// All M-Pesa API calls go through the shared apiClient so they
// automatically include the JWT Bearer token from localStorage.
// The base URL is already http://localhost:5072/api so we only
// need the path after /api.

import apiClient from './api';

export interface StkPushResponse {
  success: boolean;
  message: string;
  data: {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
  };
}

export interface StkQueryResponse {
  success: boolean;
  message: string;
  data: {
    ResponseCode: string;
    ResultCode: string;
    ResultDesc: string;
  };
}

// POST /api/payments/stk-push
// Triggers the STK prompt on the customer's phone.
// phoneNumber: any Kenyan format — backend normalizes it.
// amount: integer KES amount.
export const initiateStkPush = async (
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDescription: string
): Promise<StkPushResponse> => {
  const response = await apiClient.post('/payments/stk-push', {
    phoneNumber,
    amount,
    accountReference,
    transactionDescription,
  });
  return response.data;
};

// POST /api/payments/stk-query
// Checks status of a previous STK Push using CheckoutRequestID.
// Use when callback is delayed or to let user check manually.
export const queryStkPush = async (
  checkoutRequestId: string
): Promise<StkQueryResponse> => {
  const response = await apiClient.post('/payments/stk-query', {
    checkoutRequestId,
  });
  return response.data;
};