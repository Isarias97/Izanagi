import React from 'react';
import { AppState, Page, Worker } from './types';
import { getInitialState } from './state';

export const DataContext = React.createContext<{
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  showNotification: (title: string, message: string, isError?: boolean) => void;
  setActivePage: (page: Page) => void;
  currentUser: Worker | null;
  logout: () => void;
}>({
  state: getInitialState(),
  setState: () => {},
  showNotification: () => {},
  setActivePage: () => {},
  currentUser: null,
  logout: () => {},
});