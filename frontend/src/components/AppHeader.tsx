import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Button,
  Text,
  Flex,
  FlexItem,
  Nav,
  NavList,
  NavItem,
} from '@patternfly/react-core';
import { MoonIcon, SunIcon, CalendarAltIcon, MapIcon, SearchIcon, UsersIcon } from '@patternfly/react-icons';
import { useTheme } from '../hooks/useTheme';

export const AppHeader: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isEventsPage = location.pathname === '/' || location.pathname.startsWith('/events');
  const isSearchPage = location.pathname === '/search';
  const isPeoplePage = location.pathname === '/people';
  const isPlacesPage = location.pathname === '/places';

  return (
    <Masthead>
      <MastheadMain>
        <MastheadBrand>
          <Flex alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <Text component="h1" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                📸 Photo Library
              </Text>
            </FlexItem>
          </Flex>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar isFullHeight>
          <ToolbarContent>
            <ToolbarGroup>
              <ToolbarItem>
                <Nav variant="horizontal">
                  <NavList>
                    <NavItem 
                      isActive={isEventsPage}
                      onClick={() => navigate('/')}
                      style={{ cursor: 'pointer' }}
                    >
                      <Flex alignItems={{ default: 'alignItemsCenter' }}>
                        <FlexItem spacer={{ default: 'spacerXs' }}>
                          <CalendarAltIcon />
                        </FlexItem>
                        <FlexItem>Events</FlexItem>
                      </Flex>
                    </NavItem>
                      <NavItem 
                        isActive={isSearchPage}
                        onClick={() => navigate('/search')}
                        style={{ cursor: 'pointer' }}
                      >
                        <Flex alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem spacer={{ default: 'spacerXs' }}>
                            <SearchIcon />
                          </FlexItem>
                          <FlexItem>Search</FlexItem>
                        </Flex>
                      </NavItem>

                      <NavItem 
                        isActive={isPeoplePage}
                        onClick={() => navigate('/people')}
                        style={{ cursor: 'pointer' }}
                      >
                        <Flex alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem spacer={{ default: 'spacerXs' }}>
                            <UsersIcon />
                          </FlexItem>
                          <FlexItem>People</FlexItem>
                        </Flex>
                      </NavItem>
                    <NavItem 
                      isActive={isPlacesPage}
                      onClick={() => navigate('/places')}
                      style={{ cursor: 'pointer' }}
                    >
                      <Flex alignItems={{ default: 'alignItemsCenter' }}>
                        <FlexItem spacer={{ default: 'spacerXs' }}>
                          <MapIcon />
                        </FlexItem>
                        <FlexItem>Places</FlexItem>
                      </Flex>
                    </NavItem>
                  </NavList>
                </Nav>
              </ToolbarItem>
            </ToolbarGroup>
            <ToolbarGroup align={{ default: 'alignRight' }}>
              <ToolbarItem>
                <Button
                  variant="plain"
                  onClick={toggleTheme}
                  aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
                >
                  {isDark ? <SunIcon /> : <MoonIcon />}
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
    </Masthead>
  );
};
