import { Suspense } from 'react';
import { GoogleConnectCallback } from './google-connect-callback';

export default function Page() {
  return (
    <Suspense>
      <GoogleConnectCallback />
    </Suspense>
  );
}
