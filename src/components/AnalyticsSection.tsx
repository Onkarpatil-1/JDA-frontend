import { Box, Typography, Grid } from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, ComposedChart, Line
} from 'recharts';

interface ZoneData {
    name: string;
    onTime: number;
    avgTime: number;
}

interface DeptData {
    name: string;
    avgTime: number;
}

interface Props {
    zoneData: ZoneData[];
    deptData: DeptData[];
}

const AnalyticsSection: React.FC<Props> = ({ zoneData, deptData }) => {
    return (
        <Box sx={{ mt: 4 }}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 6 }}>
                    <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5, fontFamily: 'Outfit !important' }}>
                            On-Time Performance (%)
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 3 }}>
                            Performance efficiency tracked across major city zones.
                        </Typography>
                        <Box sx={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={zoneData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="onTime" radius={[6, 6, 0, 0]} barSize={32}>
                                        {zoneData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.onTime < 80 ? '#ef4444' : '#3b82f6'} fillOpacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Box>
                </Grid>

                <Grid size={{ xs: 12, lg: 6 }}>
                    <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5, fontFamily: 'Outfit !important' }}>
                            Departmental Processing (Days)
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 3 }}>
                            Average turnaround time by administrative department.
                        </Typography>
                        <Box sx={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={deptData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                        width={150}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="avgTime" fill="#10b981" radius={[0, 6, 6, 0]} barSize={16} fillOpacity={0.8} />
                                    <Line dataKey="avgTime" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AnalyticsSection;
