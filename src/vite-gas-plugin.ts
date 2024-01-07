import copy from "rollup-plugin-copy";

function transform(content: Buffer, filename: string) {
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
        code = code.replace(p, `<?!= gas_include('${res}') ?>\n`);
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
        code = code.replace(p, `<?!= gas_include('${res}') ?>\n`);
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
  inputPath?: string;
  outputPath?: string;
};

export function gasApp(
  options: ViteGasAppOptions = { inputPath: "/src/", outputPath: "/dist" }
) {
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
        transform: transform,
        rename: (name, ext, path) =>
          `${path.replace(`${options.inputPath}`, `/`)}.html`,
      },
    ],
  });
}
