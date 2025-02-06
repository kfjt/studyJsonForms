import { FC, useMemo, useState } from 'react';
import { JsonForms } from '@jsonforms/react';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import {
  GroupLayout,
  isControl,
  isGroup,
  JsonSchema,
  Layout,
  UISchemaElement,
} from '@jsonforms/core';
import {
  materialCells,
  materialRenderers,
} from '@jsonforms/material-renderers';
import RatingControl from './RatingControl';
import ratingControlTester from '../ratingControlTester';
import AccordionLayout, { AccordionLayoutTester } from './AccordionLayout';
import initialSchema from '../schema.json';
import initialUischema from '../uischema.json';

const classes = {
  container: {
    padding: '1em',
    width: '100%',
  },
  title: {
    textAlign: 'center',
    padding: '0.25em',
  },
  dataContent: {
    display: 'flex',
    justifyContent: 'center',
    borderRadius: '0.25em',
    backgroundColor: '#cecece',
    marginBottom: '1rem',
  },
  resetButton: {
    margin: 'auto !important',
    display: 'block !important',
  },
  demoform: {
    margin: 'auto',
    padding: '1rem',
  },
};

const initialData = {
  name: 'Send email to Adrian',
  description: 'Confirm if you have passed the subject\nHereby ...',
  done: true,
  recurrence: 'Daily',
  rating: 6,
  subtask: {
    name: 'Reply to email from Rocky',
    done: true,
  },
};

const renderers = [
  ...materialRenderers,
  //register custom renderers
  { tester: ratingControlTester, renderer: RatingControl },
  { tester: AccordionLayoutTester, renderer: AccordionLayout },
];

const findAndInsertSubstack = (
  uischemaElements: UISchemaElement[],
  count: number,
) => {
  let updatedElements = [...uischemaElements];
  for (let i = 0; i < updatedElements.length; i++) {
    const element = updatedElements[i];
    if (
      isGroup(element as Layout) &&
      (element as GroupLayout).label === 'Subtask'
    ) {
      updatedElements.splice(i + 1, 0, {
        ...element,
        label: `Subtask ${count}`,
        elements: [
          ...(element as Layout).elements.map(el => {
            if (isControl(el)) {
              return {
                ...el,
                scope: el.scope.replace(/subtask/g, `subtask__ADD_${count}`),
              };
            } else {
              return el;
            }
          }),
        ],
      } as UISchemaElement);
      return updatedElements;
    }

    const layoutElement = element as Layout;
    if (layoutElement.elements) {
      const nestedElements = findAndInsertSubstack(
        layoutElement.elements,
        count,
      );
      if (nestedElements !== layoutElement.elements) {
        updatedElements[i] = {
          ...layoutElement,
          elements: nestedElements,
        } as Layout;
      }
    }
  }
  return updatedElements;
};

export const JsonFormsDemo: FC = () => {
  const [schema, setSchema] = useState<JsonSchema>(initialSchema);
  const [uischema, setUischema] = useState<UISchemaElement>(initialUischema);
  const [data, setData] = useState<object>(initialData);
  const stringifiedData = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const clearData = () => {
    setData({});
  };

  const addSubTask = () => {
    console.log('add subtask');
    const updatedSchema = { ...schema };
    const subtaskKeyBase = 'subtask';
    let count = 1;

    if (!updatedSchema.properties) {
      updatedSchema.properties = {};
    }
    while (updatedSchema.properties[`${subtaskKeyBase}__ADD_${count}`]) {
      count++;
    }

    updatedSchema.properties[`${subtaskKeyBase}__ADD_${count}`] = {
      ...updatedSchema.properties[subtaskKeyBase],
      title: `Subtask ${count}`,
    };
    setSchema(updatedSchema);

    const updatedUischema = { ...uischema } as Layout;
    updatedUischema.elements = findAndInsertSubstack(
      updatedUischema.elements,
      count,
    );
    setUischema(updatedUischema);
  };

  return (
    <Grid
      container
      justifyContent={'center'}
      spacing={1}
      style={classes.container}>
      <Grid item sm={6}>
        <Typography variant={'h4'}>Bound data</Typography>
        <div style={classes.dataContent}>
          <pre id="boundData">{stringifiedData}</pre>
        </div>
        <Button
          style={classes.resetButton}
          onClick={clearData}
          color="primary"
          variant="contained"
          data-testid="clear-data">
          Clear data
        </Button>
      </Grid>
      <Grid item sm={6}>
        <Typography variant={'h4'}>Rendered form</Typography>
        <Button onClick={addSubTask} color="secondary" variant="contained">
          Add subtask
        </Button>
        <div style={classes.demoform}>
          <JsonForms
            schema={schema}
            uischema={uischema}
            data={data}
            renderers={renderers}
            cells={materialCells}
            onChange={({ data }) => setData(data)}
          />
        </div>
      </Grid>
    </Grid>
  );
};
