import React from 'react';
import { Input } from 'antd';

interface PanelSearchBoxProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export const PanelSearchBox: React.FC<PanelSearchBoxProps> = ({ placeholder, value, onChange }) => (
  <Input.Search
    allowClear
    size="small"
    placeholder={placeholder}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="rd-panel-search"
  />
);
