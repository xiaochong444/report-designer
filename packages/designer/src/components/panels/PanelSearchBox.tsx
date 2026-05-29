import React from 'react';
import { Input } from 'antd';

const { Search } = Input;

interface PanelSearchBoxProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export const PanelSearchBox: React.FC<PanelSearchBoxProps> = ({ placeholder, value, onChange }) => (
  <Search
    allowClear
    size="small"
    aria-label={placeholder}
    placeholder={placeholder}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="rd-panel-search"
    style={{ width: '100%' }}
  />
);
