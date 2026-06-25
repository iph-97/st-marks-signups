const App = () => {
  return React.createElement('div', { style: { padding: '20px', fontSize: '24px' } }, 'Hello World - Babel Works!');
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
