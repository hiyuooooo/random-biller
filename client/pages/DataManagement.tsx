import React from "react";
import { Layout } from "@/components/Layout";
import { BackupSystem } from "@/components/BackupSystem";
import { AccountManager } from "@/components/AccountManager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Settings, Users } from "lucide-react";

export default function DataManagement() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Data Management</h1>
            <p className="text-muted-foreground">
              Manage your business data, accounts, and system backups
            </p>
          </div>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="backup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="backup" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Backup & Restore</span>
            </TabsTrigger>
            <TabsTrigger
              value="accounts"
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Account Management</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>System Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="backup">
            <BackupSystem />
          </TabsContent>

          <TabsContent value="accounts">
            <AccountManager />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system preferences and application settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4" />
                    <p>System settings will be available in future updates.</p>
                    <p className="text-sm">
                      This will include theme preferences, default values, and
                      more.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
