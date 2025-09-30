import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextInput,
  Button,
  Flex,
  FlexItem,
  Card,
  CardBody,
  Text,
  TextContent,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';

export const QuickSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card>
      <CardBody>
        <TextContent style={{ marginBottom: '1rem' }}>
          <Text component="h3">Quick Search</Text>
          <Text component="small">
            Search your photo library by filename, camera model, or other metadata
          </Text>
        </TextContent>
        
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem grow={{ default: 'grow' }}>
            <TextInput
              type="text"
              value={query}
              onChange={(_, value) => setQuery(value)}
              onKeyPress={handleKeyPress}
              placeholder="Search photos..."
            />
          </FlexItem>
          <FlexItem>
            <Button
              variant="primary"
              onClick={handleSearch}
              icon={<SearchIcon />}
            >
              Search
            </Button>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};
