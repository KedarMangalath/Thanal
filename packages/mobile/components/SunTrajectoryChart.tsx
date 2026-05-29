import type { RouteAnalysis } from "@thanal/shared";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { useTheme } from "../theme";

type SunTrajectoryChartProps = {
  analysis: RouteAnalysis | null;
};

export default function SunTrajectoryChart({ analysis }: SunTrajectoryChartProps) {
  const { theme } = useTheme();
  
  if (!analysis || analysis.timeline.length < 2) return null;

  const points = analysis.timeline.map((segment) => segment.sunAltitudeDegrees);
  const minAlt = Math.min(...points, 0);
  const maxAlt = Math.max(...points, 90);
  const altRange = maxAlt - minAlt;

  const width = 300;
  const height = 80;
  const padding = 10;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const step = graphWidth / Math.max(1, points.length - 1);
  const pathD = points
    .map((alt, i) => {
      const x = padding + i * step;
      const y = height - padding - ((alt - minAlt) / Math.max(1, altRange)) * graphHeight;
      return `${i === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textSecondary }]}>Sun Altitude Trajectory</Text>
        <Text style={styles.subtitle}>Glare marked in red</Text>
      </View>
      <View style={styles.svgContainer}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Path d={pathD} fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={theme.colors.border} strokeDasharray="4 4" />
          {analysis.timeline.map((segment, i) => {
            if (!segment.glareRisk) return null;
            const x = padding + i * step;
            const y = height - padding - ((segment.sunAltitudeDegrees - minAlt) / Math.max(1, altRange)) * graphHeight;
            return <Circle key={i} cx={x} cy={y} r="3" fill="#EF4444" />;
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginTop: 4
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline"
  },
  title: {
    fontSize: 12
  },
  subtitle: {
    fontSize: 10,
    color: "#EF4444"
  },
  svgContainer: {
    width: "100%",
    height: 80,
    alignItems: "center"
  }
});
