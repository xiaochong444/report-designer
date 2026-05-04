import { useState } from 'react';
import { Layout } from 'antd';
import { Designer } from '@report-designer/designer';
import { createDefaultTemplate } from '@report-designer/core';
import type { TextComponent } from '@report-designer/core';

const { Content } = Layout;

function App() {
  const [template] = useState(() => {
    const t = createDefaultTemplate('Demo Report');

    // Add a simple data source
    t.dataSources = [
      {
        id: 'ds_employees',
        name: 'Employees',
        type: 'json',
        schema: [
          { name: 'Name', type: 'string' },
          { name: 'Department', type: 'string' },
          { name: 'Salary', type: 'number' },
          { name: 'HireDate', type: 'date' },
        ],
      },
    ];

    // Add a text component to the title band
    const titleBand = t.pages[0].bands.find(b => b.type === 'reportTitle')!;
    titleBand.components = [{
      id: 'txt_title',
      type: 'text',
      x: 20,
      y: 5,
      width: 170,
      height: 20,
      style: '',
      text: 'Employee Report',
      font: {
        family: 'Arial',
        size: 18,
        bold: true,
        italic: false,
        underline: false,
        color: '#1a1a1a',
      },
      textAlign: 'center',
      verticalAlign: 'middle',
      border: {
        style: 'none',
        width: 0,
        color: '#000',
        sides: { top: false, right: false, bottom: false, left: false },
      },
      canGrow: false,
      canShrink: false,
    }] as TextComponent[];

    // Add components to the data band
    const dataBand = t.pages[0].bands.find(b => b.type === 'data')!;
    dataBand.dataSource = 'ds_employees';
    dataBand.height = 25;
    dataBand.components = [
      {
        id: 'txt_name',
        type: 'text',
        x: 20,
        y: 2,
        width: 60,
        height: 18,
        style: '',
        text: '{Employees.Name}',
        font: {
          family: 'Arial',
          size: 11,
          bold: false,
          italic: false,
          underline: false,
          color: '#000',
        },
        textAlign: 'left',
        verticalAlign: 'middle',
        border: {
          style: 'solid',
          width: 0.3,
          color: '#ddd',
          sides: { top: false, right: false, bottom: true, left: false },
        },
        canGrow: false,
        canShrink: false,
      },
      {
        id: 'txt_dept',
        type: 'text',
        x: 80,
        y: 2,
        width: 50,
        height: 18,
        style: '',
        text: '{Employees.Department}',
        font: {
          family: 'Arial',
          size: 11,
          bold: false,
          italic: false,
          underline: false,
          color: '#000',
        },
        textAlign: 'center',
        verticalAlign: 'middle',
        border: {
          style: 'solid',
          width: 0.3,
          color: '#ddd',
          sides: { top: false, right: false, bottom: true, left: false },
        },
        canGrow: false,
        canShrink: false,
      },
      {
        id: 'txt_salary',
        type: 'text',
        x: 130,
        y: 2,
        width: 40,
        height: 18,
        style: '',
        text: '{Employees.Salary}',
        font: {
          family: 'Arial',
          size: 11,
          bold: false,
          italic: false,
          underline: false,
          color: '#000',
        },
        textAlign: 'right',
        verticalAlign: 'middle',
        border: {
          style: 'solid',
          width: 0.3,
          color: '#ddd',
          sides: { top: false, right: false, bottom: true, left: false },
        },
        canGrow: false,
        canShrink: false,
      },
    ] as TextComponent[];

    // Add page footer with page number
    const pageFooter = t.pages[0].bands.find(b => b.type === 'pageFooter')!;
    pageFooter.components = [{
      id: 'txt_page_num',
      type: 'text',
      x: 80,
      y: 2,
      width: 50,
      height: 15,
      style: '',
      text: 'Page 1',
      font: {
        family: 'Arial',
        size: 9,
        bold: false,
        italic: false,
        underline: false,
        color: '#999',
      },
      textAlign: 'center',
      verticalAlign: 'middle',
      border: {
        style: 'none',
        width: 0,
        color: '#000',
        sides: { top: false, right: false, bottom: false, left: false },
      },
      canGrow: false,
      canShrink: false,
    }] as TextComponent[];

    return t;
  });

  const [sampleData] = useState({
    ds_employees: [
      { Name: 'Alice Johnson', Department: 'Engineering', Salary: 85000, HireDate: '2020-01-15' },
      { Name: 'Bob Smith', Department: 'Marketing', Salary: 72000, HireDate: '2019-06-01' },
      { Name: 'Carol White', Department: 'Engineering', Salary: 91000, HireDate: '2018-03-20' },
      { Name: 'David Brown', Department: 'Sales', Salary: 68000, HireDate: '2021-09-10' },
      { Name: 'Eve Davis', Department: 'Engineering', Salary: 95000, HireDate: '2017-11-05' },
      { Name: 'Frank Miller', Department: 'Marketing', Salary: 78000, HireDate: '2020-07-22' },
      { Name: 'Grace Wilson', Department: 'Sales', Salary: 71000, HireDate: '2022-01-30' },
      { Name: 'Henry Taylor', Department: 'Engineering', Salary: 88000, HireDate: '2019-04-15' },
    ],
  });

  return (
    <Layout style={{ height: '100vh' }}>
      <Content>
        <Designer template={template} data={sampleData} />
      </Content>
    </Layout>
  );
}

export default App;
