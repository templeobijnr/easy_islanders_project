import React from 'react';
import renderer from 'react-test-renderer';
import Chip from '../Chip';

describe('Chip Snapshots', () => {
  test('renders default chip', () => {
    const tree = renderer.create(<Chip>Default Chip</Chip>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders primary variant', () => {
    const tree = renderer.create(<Chip variant="primary">Primary</Chip>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders success variant', () => {
    const tree = renderer.create(<Chip variant="success">Success</Chip>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders warning variant', () => {
    const tree = renderer.create(<Chip variant="warning">Warning</Chip>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders danger variant', () => {
    const tree = renderer.create(<Chip variant="danger">Danger</Chip>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders small size', () => {
    const tree = renderer.create(<Chip size="sm">Small</Chip>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders large size', () => {
    const tree = renderer.create(<Chip size="lg">Large</Chip>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders removable chip', () => {
    const tree = renderer.create(<Chip removable>Removable</Chip>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders with motion variants', () => {
    const tree = renderer.create(
      <Chip
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Motion Chip
      </Chip>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});