import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAccount, type Account } from "@/components/AccountManager";
import { Building2, MapPin, Phone, Mail, ArrowRight } from "lucide-react";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { accounts, setActiveAccount } = useAccount();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
  };

  const handleLogin = () => {
    if (selectedAccount) {
      setActiveAccount(selectedAccount);
      onLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            BillMaster Pro
          </h1>
          <p className="text-lg text-gray-600">
            Select your business account to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedAccount?.id === account.id
                  ? "ring-2 ring-blue-500 shadow-lg"
                  : "hover:shadow-md"
              }`}
              onClick={() => handleAccountSelect(account)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span>{account.name}</span>
                  </CardTitle>
                  {selectedAccount?.id === account.id && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </div>
                <CardDescription>Business Account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {account.address}
                    </span>
                  </div>
                  {account.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {account.phone}
                      </span>
                    </div>
                  )}
                  {account.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {account.email}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedAccount && (
          <div className="mt-8 text-center">
            <Button
              onClick={handleLogin}
              size="lg"
              className="px-8 py-3 text-lg"
            >
              Continue to Dashboard
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Secure multi-account billing system with separate data storage for
            each business
          </p>
        </div>
      </div>
    </div>
  );
}
