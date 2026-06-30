import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import { deletePerformanceScan } from '../../api/performance';
import { DashboardHeader } from '../../components/DashboardHeader';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import type { PerformanceStackParamList } from '../../navigation/PerformanceStack';
import { PerformanceResultView } from './PerformanceResultView';

type Props = NativeStackScreenProps<PerformanceStackParamList, 'PerformanceResult'>;

export function PerformanceResultScreen({ navigation, route }: Props) {
  const { result } = route.params;
  const { token } = useAuth();

  const handleDelete = () => {
    if (!token || !result._id) return;
    Alert.alert('Delete scan', 'Remove this scan from history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePerformanceScan(token, result._id);
            navigation.navigate('PerformanceHistory');
          } catch {
            Alert.alert('Error', 'Could not delete scan.');
          }
        },
      },
    ]);
  };

  const handleRerun = () => {
    navigation.navigate('PerformanceScan', {
      url: result.url,
      viewport: result.viewport === 'mobile' ? 'mobile' : 'desktop',
      autoStart: true,
    });
  };

  return (
    <Screen scroll>
      <DashboardHeader />
      <PerformanceResultView
        result={result}
        onDelete={token && result._id ? handleDelete : undefined}
        onRerun={handleRerun}
      />
    </Screen>
  );
}
