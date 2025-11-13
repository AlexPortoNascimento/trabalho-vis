export function exportPNG() {
  const svg = document.querySelector('svg');
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    canvas.width = svg.clientWidth;
    canvas.height = svg.clientHeight;
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    const link = document.createElement('a');
    link.download = 'grafico.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  img.src = url;
}

