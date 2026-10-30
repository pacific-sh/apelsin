export type Story = {
  id: number;
  title: string;
  points: number;
  comments: number;
  url: string | null;
  text: string | null;
};

export type Snapshot = {
  day: string;
  stories: Story[];
};

export type Issue = Snapshot & { number: number };

export type Feed = { size: number; name: string; hasPages: boolean; issues: Issue[] };
