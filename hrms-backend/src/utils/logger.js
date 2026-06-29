const isProduction = process.env.NODE_ENV === 'production';

const write = (stream, args) => {
  if (isProduction) return;
  stream.write(`${args.map(String).join(' ')}\n`);
};

export const logger = {
  info: (...args) => write(process.stdout, args),
  error: (...args) => write(process.stderr, args),
};
