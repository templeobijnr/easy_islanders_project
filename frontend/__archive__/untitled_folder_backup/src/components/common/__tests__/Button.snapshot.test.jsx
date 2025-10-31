import React from 'react';
import renderer from 'react-test-renderer';
import Button from '../Button';

describe('Button Snapshots', () => {
  test('renders default button', () => {
    const tree = renderer.create(<Button>Default Button</Button>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders primary variant', () => {
    const tree = renderer.create(<Button variant="primary">Primary</Button>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders secondary variant', () => {
    const tree = renderer.create(<Button variant="secondary">Secondary</Button>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders danger variant', () => {
    const tree = renderer.create(<Button variant="danger">Danger</Button>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders small size', () => {
    const tree = renderer.create(<Button size="sm">Small</Button>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders large size', () => {
    const tree = renderer.create(<Button size="lg">Large</Button>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders disabled state', () => {
    const tree = renderer.create(<Button disabled>Disabled</Button>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders loading state', () => {
    const tree = renderer.create(<Button loading>Loading</Button>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders with motion variants', () => {
    const tree = renderer.create(
      <Button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Motion Button
      </Button>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});