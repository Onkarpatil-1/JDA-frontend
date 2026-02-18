#!/usr/bin/env python3
"""
SLA Data Analysis Script
Analyzes government ticket data and generates insights
"""

import pandas as pd
import numpy as np
from datetime import datetime
import json
import sys

def load_data(csv_path):
    """Load CSV data"""
    df = pd.read_csv(csv_path, encoding='utf-8-sig')
    return df

def calculate_sla_metrics(df):
    """Calculate SLA performance metrics"""
    metrics = {
        'total_tickets': int(len(df['Ticket ID'].unique())),
        'total_workflow_steps': int(len(df)),
        'avg_days_rested': float(df['TotalDaysRested'].mean()),
        'max_days_rested': int(df['TotalDaysRested'].max()),
        'min_days_rested': int(df['TotalDaysRested'].min()),
        'std_days_rested': float(df['TotalDaysRested'].std()),
    }
    
    # Completed vs Pending
    completed = df[df['LifeTimeRemarks'].str.contains('Case Closed|Delivered|Issued', case=False, na=False)]
    metrics['completed_tickets'] = int(len(completed['Ticket ID'].unique()))
    metrics['completion_rate'] = float((metrics['completed_tickets'] / metrics['total_tickets']) * 100)
    
    return metrics

def department_performance(df):
    """Analyze department performance"""
    dept_stats = df.groupby('DepartmentName').agg({
        'Ticket ID': 'count',
        'TotalDaysRested': ['mean', 'max', 'std']
    }).round(2)
    
    dept_stats.columns = ['Total_Steps', 'Avg_Days', 'Max_Days', 'Std_Days']
    return dept_stats.to_dict('index')

def employee_workload(df):
    """Analyze employee workload"""
    # Filter out system entries
    employees = df[~df['Employee'].isin(['Nofo', '', 'NULL', None])]
    
    workload = employees.groupby(['Employee', 'Post']).agg({
        'Ticket ID': 'count',
        'TotalDaysRested': 'mean'
    }).round(2)
    
    workload.columns = ['Tasks_Handled', 'Avg_Processing_Time']
    workload = workload.sort_values('Tasks_Handled', ascending=False)
    
    # Convert to dict with string keys
    result = {}
    for (emp, post), row in workload.head(20).iterrows():
        key = f"{emp} ({post})"
        result[key] = {
            'Tasks_Handled': int(row['Tasks_Handled']),
            'Avg_Processing_Time': float(row['Avg_Processing_Time'])
        }
    
    return result

def detect_bottlenecks(df):
    """Detect bottlenecks in the workflow"""
    # Find steps with high processing time
    bottlenecks = df[df['TotalDaysRested'] > df['TotalDaysRested'].quantile(0.9)]
    
    bottleneck_analysis = bottlenecks.groupby('Post').agg({
        'Ticket ID': 'count',
        'TotalDaysRested': 'mean'
    }).round(2)
    
    bottleneck_analysis.columns = ['Occurrences', 'Avg_Delay_Days']
    bottleneck_analysis = bottleneck_analysis.sort_values('Avg_Delay_Days', ascending=False)
    
    return bottleneck_analysis.to_dict('index')

def service_type_analysis(df):
    """Analyze by service type"""
    service_stats = df.groupby('ServiceName').agg({
        'Ticket ID': 'nunique',
        'TotalDaysRested': 'mean'
    }).round(2)
    
    service_stats.columns = ['Unique_Tickets', 'Avg_Processing_Time']
    service_stats = service_stats.sort_values('Unique_Tickets', ascending=False)
    
    return service_stats.to_dict('index')

def find_anomalies(df, z_threshold=2):
    """Find anomalous processing times using z-score"""
    mean = df['TotalDaysRested'].mean()
    std = df['TotalDaysRested'].std()
    
    df['z_score'] = np.abs((df['TotalDaysRested'] - mean) / std)
    anomalies = df[df['z_score'] > z_threshold]
    
    return {
        'count': len(anomalies),
        'percentage': (len(anomalies) / len(df)) * 100,
        'examples': anomalies[['Ticket ID', 'Post', 'TotalDaysRested', 'z_score']].head(10).to_dict('records')
    }

def main():
    csv_path = '../AI Extract Data.csv'
    
    print("🔍 Loading SLA data...")
    df = load_data(csv_path)
    
    print(f"✅ Loaded {len(df)} workflow steps for {df['Ticket ID'].nunique()} unique tickets\n")
    
    # Calculate metrics
    print("📊 Calculating SLA Metrics...")
    metrics = calculate_sla_metrics(df)
    print(json.dumps(metrics, indent=2))
    
    print("\n🏢 Department Performance:")
    dept_perf = department_performance(df)
    for dept, stats in list(dept_perf.items())[:5]:
        print(f"  {dept}: {stats['Total_Steps']} steps, {stats['Avg_Days']:.1f} avg days")
    
    print("\n👥 Top Employees by Workload:")
    emp_workload = employee_workload(df)
    for emp_post, stats in list(emp_workload.items())[:10]:
        print(f"  {emp_post}: {stats['Tasks_Handled']} tasks, {stats['Avg_Processing_Time']:.1f} avg days")
    
    print("\n🚨 Bottlenecks Detected:")
    bottlenecks = detect_bottlenecks(df)
    for post, stats in list(bottlenecks.items())[:5]:
        print(f"  {post}: {stats['Occurrences']} cases, {stats['Avg_Delay_Days']:.1f} avg delay days")
    
    print("\n📋 Service Type Analysis:")
    services = service_type_analysis(df)
    for service, stats in list(services.items())[:5]:
        print(f"  {service}: {stats['Unique_Tickets']} tickets, {stats['Avg_Processing_Time']:.1f} avg days")
    
    print("\n⚠️  Anomaly Detection:")
    anomalies = find_anomalies(df)
    print(f"  Found {anomalies['count']} anomalies ({anomalies['percentage']:.1f}% of data)")
    print(f"  Top anomalies:")
    for ex in anomalies['examples'][:5]:
        print(f"    Ticket {ex['Ticket ID']} - {ex['Post']}: {ex['TotalDaysRested']} days (z-score: {ex['z_score']:.2f})")
    
    # Save analysis to JSON
    output = {
        'metrics': metrics,
        'department_performance': dept_perf,
        'employee_workload': emp_workload,
        'bottlenecks': bottlenecks,
        'service_analysis': services,
        'anomalies': anomalies
    }
    
    with open('sla_analysis.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print("\n✅ Analysis complete! Results saved to sla_analysis.json")

if __name__ == '__main__':
    main()
