import { MaterialLayoutRenderer } from '@jsonforms/material-renderers';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import { rankWith, uiTypeIs } from '@jsonforms/core';

const MyGroupRenderer = props => {
  const { uischema, schema, path, visible, renderers } = props;

  const layoutProps = {
    elements: uischema.elements,
    schema: schema,
    path: path,
    direction: 'column',
    visible: visible,
    uischema: uischema,
    renderers: renderers,
  };
  return (
    <Accordion sx={visible ? {} : { display: 'none' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{uischema.label}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <MaterialLayoutRenderer {...layoutProps} />
      </AccordionDetails>
    </Accordion>
  );
};

export default withJsonFormsLayoutProps(MyGroupRenderer);

export const AccordionLayoutTester = rankWith(
  3, //increase rank as needed
  uiTypeIs('Group'),
);
