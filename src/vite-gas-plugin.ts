import copy from "rollup-plugin-copy";

function transform(
  content: Buffer,
  filename: string,
  options: ViteGasAppOptions
) {
  if (/\.js$/.test(filename)) {
    let code = content.toString();
    code = `<script>
    ${code}
    </script>`;
    return Buffer.from(code);
  } else if (/\.css?$/.test(filename)) {
    let code = content.toString();
    code = `<style>
    ${code}
    </style>`;
    return Buffer.from(code);
  } else if (/\.html?$/.test(filename)) {
    let code = content.toString();

    const scripts = code.match(/<script.*src=.\..+.*>.*<\/script>(\n?)/gi);
    const links = code.match(/<link.*href=.\..+>(\n?)/gi);

    scripts
      ?.filter((p) => /x-gas-include/.test(p))
      .forEach((p) => {
        const res = /(\.\.?\/)+([^'"]+)(['"]?)/i.exec(p)![2];
        code = code.replace(
          p,
          `<?!= ${options.includeFunctionName}('${res}') ?>\n`
        );
      });
    scripts
      ?.filter((p) => !/x-gas-include/.test(p))
      .forEach((p) => {
        code = code.replace(p, "");
      });

    links
      ?.filter((p) => /x-gas-include/.test(p))
      .forEach((p) => {
        const res = /(\.\.?\/)+([^'"]+)(['"]?)/i.exec(p)![2];
        code = code.replace(
          p,
          `<?!= ${options.includeFunctionName}('${res}') ?>\n`
        );
      });
    links
      ?.filter((p) => !/x-gas-include/.test(p))
      .forEach((p) => {
        code = code.replace(p, "");
      });

    return Buffer.from(code);
  } else return content;
}

export type ViteGasAppOptions = {
  includeFunctionName: string;
  inputPath?: string;
  outputPath?: string;
};

export default function viteGasApp(options: ViteGasAppOptions) {
  options.inputPath = options.inputPath ?? "/src/";
  options.outputPath = options.outputPath ?? "/dist";

  return copy({
    flatten: true,
    targets: [
      {
        src: [
          `.${options.inputPath}ui/**/*.html`,
          `.${options.inputPath}ui/**/*.css`,
          `.${options.inputPath}ui/**/*.js`,
        ],
        dest: `.${options.outputPath}`,
        transform: (content: Buffer, filename: string) =>
          transform(content, filename, options),
        rename: (name, ext, path) =>
          `${path.replace(`${options.inputPath}`, `/`)}.html`,
      },
    ],
  });
}
