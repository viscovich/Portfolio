import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartPoint } from '../types';

interface PortfolioChartProps {
  data: ChartPoint[];
  color?: string;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ data, color = '#3b82f6' }) => {
  // Format data for chart
  const chartData = data.map(point => ({
    date: point.date,
    value: point.value
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={['dataMin - 5', 'dataMax + 5']}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(2)}`, 'Value']}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleDateString();
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PortfolioChart;