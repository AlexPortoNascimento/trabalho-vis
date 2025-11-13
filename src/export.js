export function exportSVG() {
  const svg = document.querySelector('svg');
  const serializer = new XMLSerializer();
  const svgBlob = new Blob([serializer.serializeToString(svg)], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'grafico.svg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
