// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import Modal from './Modal';

describe('Modal', () => {
  it('muestra el contenido cuando está abierto', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Title">
        <div>Contenido de prueba</div>
      </Modal>
    );
    expect(screen.getByText('Contenido de prueba')).toBeInTheDocument();
  });

  it('no muestra el contenido cuando está cerrado', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Title">
        <div>Contenido oculto</div>
      </Modal>
    );
    expect(screen.queryByText('Contenido oculto')).toBeNull();
  });
}); 