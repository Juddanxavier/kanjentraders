/** @format */

// React 19 compatibility shim for better-auth
// This exports React hooks that might be missing or have changed in React 19

import * as React from 'react';

// Re-export all of React
export * from 'react';

// Ensure specific hooks are available
export const useRef = React.useRef;
export const useEffect = React.useEffect;
export const useState = React.useState;
export const useCallback = React.useCallback;
export const useMemo = React.useMemo;
export const useContext = React.useContext;
export const createContext = React.createContext;

// Default export
export default React;
