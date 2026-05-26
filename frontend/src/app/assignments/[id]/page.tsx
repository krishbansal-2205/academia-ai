import { AssignmentOutputPage } from '../../../components/pages/assignment-output-page';

export default async function Page(props: PageProps<'/assignments/[id]'>) {
  const { id } = await props.params;
  return <AssignmentOutputPage assignmentId={id} />;
}
