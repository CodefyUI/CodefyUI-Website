export const en = {
  lang: 'en',
  htmlLang: 'en',
  meta: {
    title: 'CodefyUI — Deep learning you can see inside',
    description:
      'CodefyUI is an open-source, node-based deep learning builder. Wire CNN, RNN, Transformer, LLM, diffusion and RL models on a canvas, run them on CPU or GPU, and inspect every tensor.',
    ogAlt: 'A CodefyUI graph: TensorInput, Conv2dExplicit, Activation, MaxPool2d and Visualize nodes wired together.',
  },
  skip: 'Skip to content',
  nav: {
    label: 'Main',
    editor: 'Editor',
    nodes: 'Nodes',
    teaching: 'Teaching',
    ship: 'Ship',
    docs: 'Docs',
    github: 'GitHub',
    install: 'Install',
    switchTo: '中文',
    switchLabel: 'Read this page in Traditional Chinese',
    menu: 'Menu',
    close: 'Close',
  },
  hero: {
    title: ['Deep learning', 'you can see inside.'],
    lead:
      'CodefyUI is an open-source, node-based builder for deep learning. Drag layers onto a canvas, wire them into a graph, press Run, then click any node to see the exact numbers that came out of it.',
    ctaInstall: 'Install CodefyUI',
    ctaDocs: 'Read the docs',
    cue: 'Run the graph',
    stack: 'Python, PyTorch and React',
    version: 'Latest release',
  },
  demo: {
    label: 'A small CodefyUI graph that runs in your browser',
    title: 'This graph runs right here.',
    run: 'Run',
    running: 'Running',
    idle: 'Idle',
    done: (ms: string) => `Done in ${ms} ms`,
    reran: (n: number, ms: string) => `Re-ran ${n} ${n === 1 ? 'node' : 'nodes'} in ${ms} ms`,
    hint: 'Draw on the grid, swap the kernel, then click a node to inspect it.',
    hintTouch: 'Draw on the grid, swap the kernel, then tap a node to inspect it.',
    draw: 'Draw',
    presets: { digit: '7', ring: 'Ring', cross: 'Cross', clear: 'Clear' },
    inspector: 'Inspector',
    inspect: 'Inspect',
    input: 'Input',
    output: 'Output',
    changed: 'Changed cells are outlined',
    shape: 'shape',
    min: 'min',
    max: 'max',
    mean: 'mean',
    trigger: 'trigger',
    pickNode: 'Click a node to see its tensor.',
    inBrowser: 'This demo runs in plain JavaScript. CodefyUI itself runs every node on PyTorch.',
    gridLabel: 'TensorInput values, 8 by 8. Press a cell to toggle it.',
  },
  editor: {
    title: 'One canvas, from the first layer to a trained model.',
    lead:
      'The real editor is a browser app served by a single local process. Everything you build is a graph you can save, share and run again.',
    steps: [
      {
        name: 'Drag',
        body: 'Pick from 152 built-in nodes, or double-click the canvas and type to search nodes and presets.',
      },
      {
        name: 'Wire',
        body: 'Ports are typed. A tensor cannot go where a dataset belongs, and the graph says so before anything runs.',
      },
      {
        name: 'Run',
        body: 'Choose CPU, CUDA, Apple MPS or ROCm. Progress streams back node by node, and only what you changed runs again.',
      },
      {
        name: 'Inspect',
        body: 'Every node’s output is recorded. Compare input and output cell by cell, capture gradients, follow the loss live.',
      },
    ],
    alt: 'A recreation of the CodefyUI editor training a CNN on MNIST: the node library on the left, the graph in the middle, the execution log below.',
    replay: 'Replay',
  },
  nodes: {
    title: 'Every node, by name.',
    lead:
      'The built-in library spans classical ML, CNNs, sequence models, transformers, LLMs, diffusion, reinforcement learning and vision-language-action models. Each category keeps its colour on the canvas.',
    all: 'All',
    count: (n: number, c: number) => `${n} nodes in ${c} categories`,
    filterLabel: 'Filter nodes by category',
    reference: 'Open the node reference',
  },
  teaching: {
    title: 'Made to be taught with.',
    lead:
      'CodefyUI grew up in the classroom. Plugin packs follow a textbook module by module, and every Edu node breaks one idea into named steps that the Teaching Inspector shows a row at a time.',
    demoTitle: 'Edu-ColumnStats',
    demoBody: 'Population standard deviation, one step per row. Edit the column and watch each step recompute.',
    column: 'column',
    steps: ['sum', 'divide', 'deviations²', 'variance', 'sqrt'],
    stepNotes: ['Σx', 'Σx ÷ n = mean', '(x − mean)²', 'mean of deviations²', '√variance = σ'],
    valueLabel: (i: number) => `Value ${i}`,
    packsTitle: 'Plugin packs',
    packs: [
      { id: 'foundations', modules: 'I1 Data representation · I2 Classical ML' },
      { id: 'deep', modules: 'I3 Vision · I4 Sequences' },
      { id: 'rl', modules: 'I5 Reinforcement learning' },
      { id: 'edu', modules: 'Hands-on labs for I1 and I2' },
      { id: 'stats', modules: 'Descriptive statistics for any dataset' },
    ],
    inspectorTitle: 'Teaching Inspector',
    inspectorBody:
      'Record every node’s full output, compare a segment’s head input with its tail output, and turn on verbose internals to see attention scores and other values a layer normally hides.',
    learnMore: 'How the Teaching Inspector works',
  },
  ship: {
    title: 'When the graph works, put it to work.',
    lead: 'The same graph you sketched in a lesson can run overnight, answer HTTP requests and live in git.',
    items: [
      {
        name: 'Queue runs and sweeps',
        body: 'Runs belong to the server and queue per device, so closing the tab does not stop them. Sweep one graph over a grid or a random sample of parameters.',
        link: 'usage/run-queue',
      },
      {
        name: 'Publish as an API',
        body: 'Freeze a saved graph as a versioned app behind API keys. Every invoke is recorded, and editing the canvas never changes what is published.',
        link: 'usage/publish',
      },
      {
        name: 'Keep it in git',
        body: 'The Source Control tab stages, commits, branches, pulls and pushes a project directory without leaving the editor.',
        link: 'usage/source-control',
      },
      {
        name: 'Reproduce a baseline',
        body: 'The ResNet-18 CIFAR-10 example reaches 95.48% test accuracy, and two runs with the same seed match bit for bit.',
        link: 'usage/reproducing-baselines',
      },
    ],
    more: 'Read more',
    moreAbout: (s: string) => ` about ${s.toLowerCase()}`,
  },
  examples: {
    title: 'Start from a graph that already works.',
    lead: 'Example graphs open as tabs. Run one as it is, then take it apart.',
    groups: [
      {
        name: 'Model architectures',
        items: [
          'ResNet', 'ConvNeXt', 'EfficientNet', 'U-Net', 'ViT', 'Swin Transformer', 'BERT', 'GPT', 'LLaMA', 'DiT',
          'LSTM time series', 'BiGRU speech recognition', 'Seq2Seq with attention', 'DQN Atari', 'PPO robotics',
        ],
      },
      {
        name: 'Hands-on',
        items: [
          'Train a CNN on MNIST',
          'Train ResNet-18 on CIFAR-10',
          'king − man + woman ≈ queen',
          'Fully local RAG',
          'Pretrain an LM on TinyStories',
          'Forward diffusion on a digit',
          'Mixture-of-experts routing',
          'Train a VLA on PushWorld',
        ],
      },
    ],
    gallery: 'Browse the examples gallery',
  },
  extend: {
    title: 'A new node is one Python file.',
    lead:
      'Subclass BaseNode, declare ports and parameters, and drop the file into custom_nodes. Reload, and it appears in the library with its own card.',
    pluginsTitle: 'Plugins',
    pluginsBody:
      'Install packs from the Plugin Center or the terminal. Third-party packs come from GitHub, pinned to a commit and checked before they load.',
    copilot:
      'Graph Copilot, a community plugin, builds and edits graphs through chat with OpenAI, Claude, OpenRouter or a local model.',
    template: 'Fork the plugin template',
    customDocs: 'Custom node guide',
  },
  install: {
    title: 'Install in one line.',
    lead: 'The installer sets up git, uv and Python, downloads a prebuilt editor and picks a PyTorch build for your GPU. Node.js is not needed.',
    os: { unix: 'macOS / Linux', win: 'Windows' },
    step1: 'Install',
    step2: 'Start the server, from any new terminal',
    step3: 'Open the editor',
    copy: 'Copy',
    copied: 'Copied',
    devices: 'Runs on CPU, NVIDIA CUDA, Apple Silicon MPS and AMD ROCm.',
    guide: 'Full installation guide',
  },
  open: {
    title: 'Free to use, open to read.',
    body:
      'CodefyUI is licensed under AGPL-3.0. Running it as published, on a laptop, in a lab or on a school server, needs no commercial license. For closed-source, SaaS or OEM use, a commercial license is available from the maintainers.',
    star: 'Star on GitHub',
    faq: 'Licensing FAQ',
    contribute: 'Contributing guide',
  },
  footer: {
    docs: 'Documentation',
    releases: 'Releases',
    changelog: 'Changelog',
    issues: 'Issues',
    template: 'Plugin template',
    license: 'License',
    rights: 'CodefyUI and contributors',
    top: 'Back to top',
  },
  notFound: {
    title: 'Page not found',
    body: 'Nothing is wired to this address. The graph starts at the home page.',
    home: 'Go to the home page',
  },
};

export type Dict = typeof en;
