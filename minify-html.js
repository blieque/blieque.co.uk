import { readFileSync, writeFileSync } from 'node:fs';
import htmlnano from 'htmlnano';

htmlnano
  .process(
    readFileSync(process.argv[2]),
    {
      collapseWhitespace: 'aggressive',
      minifyCss: false,
      minifyJs: false,
      minifySvg: false,
    },
    htmlnano.presets.max,
  )
  .then((result) => {
    writeFileSync(process.argv[3], result.html);
  });
