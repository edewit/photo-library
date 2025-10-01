import React, { useState } from 'react';
import { UserIcon } from '@patternfly/react-icons';
import { personsAPI } from '../services/api';

interface PersonAvatarProps {
  person: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const PersonAvatar: React.FC<PersonAvatarProps> = ({ 
  person, 
  size = 80, 
  className = '',
  style = {}
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const showDefaultIcon = !person.avatar || imageError;

  return (
    <div 
      className={className}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`, 
        borderRadius: '50%', 
        backgroundColor: 'var(--pf-v5-global--BackgroundColor--200)',
        color: 'var(--pf-v5-global--Color--200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...style
      }}
    >
      {showDefaultIcon ? (
        <UserIcon size="lg" />
      ) : (
        <img 
          src={personsAPI.getAvatarUrl(person.id)} 
          alt={person.name}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover'
          }}
          onError={handleImageError}
        />
      )}
    </div>
  );
};
