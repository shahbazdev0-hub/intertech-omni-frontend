import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
  // Close modal when pressing Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  // Different modal sizes
  const modalSizes = {
    small: { width: '400px', maxWidth: '90vw' },
    medium: { width: '600px', maxWidth: '90vw' },
    large: { width: '800px', maxWidth: '95vw' },
    xl: { width: '1000px', maxWidth: '95vw' }
  };

  return (
    // Backdrop - the dark overlay behind the modal
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark semi-transparent background
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001, // High z-index to appear above everything
        padding: '20px'
      }}
      onClick={onClose} // Close when clicking outside modal
    >
      {/* Modal Content */}
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          ...modalSizes[size],
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Modal Header */}
        <div style={{
          padding: '24px 32px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          zIndex: 1
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#0C3D4A' 
          }}>
            {title}
          </h2>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ×
          </button>
        </div>
        
        {/* Modal Body */}
        <div style={{ padding: '24px 32px 32px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;