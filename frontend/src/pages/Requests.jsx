import React from 'react';
import Page from '../shared/components/Page';

const Requests = () => {
  return (
    <Page title="My Requests">
      <div className="bg-white/90 backdrop-blur p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <h2 className="text-xl font-semibold text-ink-700">Feature Coming Soon</h2>
        <p className="text-ink-500 mt-2">
          This is where you will be able to view and manage all the requests you've made to sellers.
        </p>
      </div>
    </Page>
  );
};

export default Requests;

