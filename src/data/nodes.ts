// Built-in node catalogue, mirrored from the CodefyUI README ("Built-in Nodes").
// Colours are the app's own category hues (frontend/src/styles/theme.ts), so a
// category wears the same colour here as on the canvas.

export interface Category {
  id: string;
  name: { en: string; zh: string };
  color: string;
  nodes: string[];
}

export const categories: Category[] = [
  { id: 'control', name: { en: 'Control', zh: '控制' }, color: '#22c55e', nodes: ['Start'] },
  {
    id: 'data',
    name: { en: 'Data', zh: '資料' },
    color: '#00bcd4',
    nodes: [
      'Dataset', 'ImageFolderDataset', 'DataLoader', 'DatasetBatch', 'Transform', 'HuggingFaceDataset',
      'KaggleDataset', 'TensorInput', 'TextInput', 'CSVReader', 'ColumnSelector', 'RowSelector', 'Normalize',
      'SyntheticDataset', 'SyntheticShapes', 'SyntheticSegmentation', 'SyntheticSequence', 'TrainTestSplit',
      'ResizeTransform', 'ToTensorTransform', 'NormalizeTransform', 'RandomCrop', 'RandomHorizontalFlip',
      'RandomRotation', 'ColorJitter', 'RandAugment', 'ComposeTransform',
    ],
  },
  { id: 'dataflow', name: { en: 'Data Flow', zh: '資料流' }, color: '#ff6f00', nodes: ['Map', 'Reduce', 'Switch'] },
  {
    id: 'cnn',
    name: { en: 'CNN', zh: 'CNN' },
    color: '#4caf50',
    nodes: [
      'Conv2d', 'Conv1d', 'Conv2dExplicit', 'ConvTranspose2d', 'MaxPool2d', 'AvgPool2d', 'AdaptiveAvgPool2d',
      'BatchNorm2d', 'Dropout', 'Activation',
    ],
  },
  { id: 'rnn', name: { en: 'RNN', zh: 'RNN' }, color: '#2397f3', nodes: ['LSTM', 'GRU', 'RNNCell'] },
  {
    id: 'transformer',
    name: { en: 'Transformer', zh: 'Transformer' },
    color: '#c279ce',
    nodes: ['MultiHeadAttention', 'TransformerEncoder', 'TransformerDecoder', 'MoELayer'],
  },
  {
    id: 'llm',
    name: { en: 'LLM', zh: 'LLM' },
    color: '#a78bfa',
    nodes: [
      'LLMChat', 'Tokenizer', 'WordVector', 'TextEmbedding', 'EmbeddingScatter', 'CosineSimilarity',
      'AttentionMask', 'AttentionHeatmap', 'PositionalEncoding', 'CausalLMModel', 'LMCrossEntropyLoss',
      'LMTokenizer', 'TextCorpusDataset', 'LMTokenizedDataset', 'DataMixDataset', 'PerplexityEvaluate',
      'TextGenerate', 'DocumentLoader', 'TextChunker', 'VectorStore', 'Retriever', 'PromptBuilder',
      'HFTextGenerate',
    ],
  },
  {
    id: 'diffusion',
    name: { en: 'Diffusion', zh: 'Diffusion' },
    color: '#ee60a6',
    nodes: ['Upsample', 'TimestepEmbedding', 'Lerp', 'GaussianNoise', 'DDPMSampler', 'DiffusionUNet', 'DiffusionTrainingLoop'],
  },
  {
    id: 'rl',
    name: { en: 'RL', zh: '強化學習' },
    color: '#ff9800',
    nodes: [
      'DQN', 'PPO', 'EnvWrapper', 'RewardModel', 'KLDivergence', 'PolicyRollout', 'PPOClipObjective',
      'GroupRelativeAdvantage', 'Discount', 'GridWorldEnv', 'PreferenceDataset', 'BradleyTerryLoss',
      'BradleyTerryTrain',
    ],
  },
  {
    id: 'vla',
    name: { en: 'VLA', zh: 'VLA' },
    color: '#a9c94f',
    nodes: ['VLAModel', 'VLARollout', 'VLAActionEval', 'PushWorldEnv', 'PushWorldDemos'],
  },
  {
    id: 'classical',
    name: { en: 'Classical', zh: '經典 ML' },
    color: '#f59e0b',
    nodes: [
      'KNN', 'LinearRegression', 'LogisticRegression', 'DecisionTreeClassifier', 'RandomForestClassifier',
      'SVMClassifier', 'MLPClassifier', 'Accuracy',
    ],
  },
  {
    id: 'training',
    name: { en: 'Training', zh: '訓練' },
    color: '#f66358',
    nodes: ['Optimizer', 'Loss', 'TrainingLoop', 'EvaluateModel', 'LRScheduler', 'SequentialModel', 'BackwardOnce'],
  },
  {
    id: 'normalization',
    name: { en: 'Normalization', zh: '正規化' },
    color: '#26a69a',
    nodes: ['BatchNorm1d', 'LayerNorm', 'GroupNorm', 'InstanceNorm2d'],
  },
  {
    id: 'tensor',
    name: { en: 'Tensor Operations', zh: '張量運算' },
    color: '#838fcf',
    nodes: [
      'Add', 'MatMul', 'Mean', 'Multiply', 'ScalarMultiply', 'Permute', 'Softmax', 'Argmax', 'Split', 'Squeeze',
      'Stack', 'TensorCreate', 'Unsqueeze', 'MaskedFill',
    ],
  },
  {
    id: 'io',
    name: { en: 'IO', zh: 'IO' },
    color: '#a78f86',
    nodes: [
      'ImageReader', 'ImageWriter', 'ImageBatchReader', 'FileReader', 'CheckpointSaver', 'CheckpointLoader',
      'ModelLoader', 'ModelSaver', 'Inference', 'GraphInput', 'GraphOutput', 'VideoLoad', 'VideoWrite',
    ],
  },
  {
    id: 'utility',
    name: { en: 'Utility', zh: '工具' },
    color: '#8097a2',
    nodes: [
      'Print', 'Reshape', 'Concat', 'Flatten', 'Linear', 'Visualize', 'Embedding', 'PythonScript',
      'ScatterPlot2D', 'DecisionBoundary',
    ],
  },
];

export const nodeCount = categories.reduce((n, c) => n + c.nodes.length, 0);
export const categoryCount = categories.length;
