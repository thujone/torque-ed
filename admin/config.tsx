import React from 'react';
import type { AdminConfig } from '@keystone-6/core/types';
import { NavigationContainer, ListNavItems, NavItem } from '@keystone-6/core/admin-ui/components';
import type { NavigationProps } from '@keystone-6/core/admin-ui/components';

function CustomLogo() {
  return <h3>TorqueEd 0.1</h3>;
}

function CustomNavigation({ lists, authenticatedItem }: NavigationProps) {
  return (
    <NavigationContainer authenticatedItem={authenticatedItem}>
      <NavItem href="/">Dashboard</NavItem>
      <NavItem href="/attendance">📊 Attendance Spreadsheet</NavItem>
      <ListNavItems lists={lists} />
    </NavigationContainer>
  );
}

export const components: AdminConfig['components'] = {
  Logo: CustomLogo,
  Navigation: CustomNavigation
};