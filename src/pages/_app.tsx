import { Layout } from '@/components/layout/Layout';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { initializeWhisperService } from '@/services/whisper';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const initializeServices = async () => {
      try {
        await initializeWhisperService();
        console.log('WhisperService initialized successfully');
      } catch (error) {
        console.error('WhisperService initialization failed:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
} 