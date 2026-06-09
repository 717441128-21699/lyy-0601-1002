import React, { useEffect } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useTheme } from '@/hooks/useTheme';
import { DataImportModule } from '@/modules/DataImport';
import { PipeNetworkMapModule } from '@/modules/PipeNetworkMap';
import { InspectionRouteModule } from '@/modules/InspectionRoute';
import { HazardListModule } from '@/modules/HazardList';
import { PhotoWallModule } from '@/modules/PhotoWall';
import { StatisticsModule } from '@/modules/Statistics';
import { SettingsModule } from '@/modules/Settings';

const Home: React.FC = () => {
  const { currentModule, loadData, isLoading } = useInspectionStore();
  const { currentTheme } = useTheme();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderModule = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg opacity-70">加载中...</p>
          </div>
        </div>
      );
    }

    switch (currentModule) {
      case 'import':
        return <DataImportModule />;
      case 'map':
        return <PipeNetworkMapModule />;
      case 'route':
        return <InspectionRouteModule />;
      case 'hazard':
        return <HazardListModule />;
      case 'photo':
        return <PhotoWallModule />;
      case 'statistics':
        return <StatisticsModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <PipeNetworkMapModule />;
    }
  };

  return (
    <MainLayout>
      <div className="min-h-full" data-theme={currentTheme}>
        {renderModule()}
      </div>
    </MainLayout>
  );
};

export default Home;
